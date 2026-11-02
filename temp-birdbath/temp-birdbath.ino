/*
  Temperature-controlled birdbath — thaw, don't cook

  BOARD: Arduino Nano (same as the feeder)
  LIBRARIES (IDE → Library Manager):
    "OneWire" by Paul Stoffregen
    "DallasTemperature" by Miles Burton

  Job: keep a SHALLOW birdbath LIQUID in cold weather.
  Target water is just above freezing, never a hot tub.
  Birds want a drink and a splash, not soup.

  Heat lives UNDER the bowl, DRY. The only wet part is the
  DS18B20 probe. No wall-current in the water. 12 V only.

  Water  <= 39 °F  → heater ON  (and optional pump ripple)
  Water  >= 46 °F  → heater OFF
  Water  >= 55 °F  → LOCKOUT. Heater stays off until cooler.
  Sensor fail      → heater OFF. Always.

  Short press  = 20 s heater test (bench, no birds needed)
  Hold 2 s     = auto on/off. LED: 2 blinks = auto on, 4 = off.

  OPTIONAL BIRD (servo you already have)
  --------------------------------------
  Bird   D9   huddled while heating
              sips once in a while when the bath is liquid
              looks away on lockout / sensor fail
  Set HAS_BIRD to 0 if the servo is busy.

  OPTIONAL PUMP
  -------------
  12 V fountain pump on a SECOND MOSFET (D5). Ripple slows
  ice. Leave HAS_PUMP 0 until you buy one.

  MOUNT
  -----
  1. Shallow plastic plant saucer / cheap birdbath. Water
     about one finger deep. Rough stone in the middle so
     birds can stand.
  2. Heat sandwich (bottom → top), ALL DRY except the bowl:

        birds
     [  water 1" + probe  ]
     = plastic saucer     =     ← the bath
     [ ceramic tile / pie tin ] ← spreads heat
     [ 12 V pad / PTC     ]     ← NEVER in the water
     [ foam insulation    ]
     [ stand / bricks     ]

     Silicone the pad edges so rain cannot sneak under.
     The PTC listing that says "don't touch water" is
     correct — that is why it is under the dish.

  3. DS18B20 stainless probe IN the water, cable tied so
     birds cannot yank it. Tip off the bottom (ice forms
     at the surface first; we want the drinkable layer).

  4. Dry box on the ground under the stand, not in the
     saucer:
       Nano, MOSFET, fuse, 12 V brick, USB 5 V brick.
     Wires leave through the LID. Silicone every hole.
     Charge / plug into a GFCI outlet. Bring the box in
     for storms.

  5. Foam bird (optional) on the rim. Servo in a snack
     bag taped under the rim, horn to a popsicle-stick
     neck. It sips the water, it does not go swimming.

        [ bird ]
     ===== bath =====
       probe ~
     [ tile ]
     [ heat ]
     [  dry box : Nano + MOSFET + bricks  ]

  POWER (two bricks, same as the feeder servo rule)
  -------------------------------------------------
  USB phone charger  →  Nano USB or 5V pin   (brain)
  12 V 2 A adapter   →  fuse 2 A  →  MOSFET  →  heater
  Share GND: Nano GND, MOSFET GND, 12 V −, probe GND.

  Do NOT run the heater from the Nano 5V pin.
  Do NOT put 120 V anything in or under the bath.
  Do NOT use a galvanized tub (zinc is bad for birds).
  Plastic, glazed ceramic, or a real birdbath only.

  WIRING
  ------
  DS18B20      red    → 5V
               black  → GND
               yellow → D4
               4.7k from yellow to 5V  (skip if your
               kit already has the little adapter board)

  Heater MOSFET module
               SIG / PWM → D3
               VIN / V+  → 12 V after the fuse
               GND       → 12 V − and Nano GND
               OUT / V−  → heater +
               heater −  → 12 V −
               (labels vary; the heater must go DARK when
               D3 is LOW. If it is stuck on, swap the module
               or invert HEAT_ON_LEVEL.)

  Pump MOSFET (optional)   SIG → D5   same 12 V rail

  Bird servo   orange → D9
               brown  → GND
               red    → 5V pack / USB 5V  (not 12 V)
  Button       D2 → button → GND
  LED onboard  D13
     slow blink = heating
     solid      = liquid, heater off
     fast blink = sensor fail or too-hot lockout

  HOW TO USE
  ----------
  1. Bench first. Bowl of ice water. Serial 9600. You want
     "Cold. Heat." then the MOSFET LED / pad warms.
  2. Room-temp water should print "Warm enough." and the
     pad should go cold.
  3. Unplug the probe: "Sensor fail. Heat off."
  4. Then take it outside. Tweak HEAT_ON_F / HEAT_OFF_F
     if your winters are meaner.
  5. Empty, scrub, and refill every few days. Stagnant
     water is worse than ice.
*/

#include <OneWire.h>
#include <DallasTemperature.h>
#include <Servo.h>

const int BUTTON_PIN = 2;
const int HEAT_PIN   = 3;
const int PROBE_PIN  = 4;
const int PUMP_PIN   = 5;
const int BIRD_PIN   = 9;
const int LED_PIN    = 13;

const bool HAS_BIRD = true;
const bool HAS_PUMP = false;

// Water must stay drinkable, not tropical.
const float HEAT_ON_F  = 39.0;
const float HEAT_OFF_F = 46.0;
const float HARD_MAX_F = 55.0;

const int HEAT_ON_LEVEL = HIGH;   // flip to LOW if your MOSFET is inverted
const int BIRD_HUDDLE   = 70;
const int BIRD_SIP      = 110;
const int BIRD_AWAY     = 45;

const unsigned long SAMPLE_MS       = 2000;
const unsigned long CONVERT_MS      = 800;
const unsigned long TEST_MS         = 20000;
const unsigned long SIP_EVERY_MS    = 45000;
const unsigned long LONG_PRESS_MS   = 2000;
const unsigned long BLINK_SLOW_MS   = 500;
const unsigned long BLINK_FAST_MS   = 120;

OneWire oneWire(PROBE_PIN);
DallasTemperature probe(&oneWire);
Servo bird;

unsigned long buttonDownMs  = 0;
unsigned long lastSampleMs  = 0;
unsigned long convertUntil  = 0;
unsigned long testUntil     = 0;
unsigned long lastSipMs     = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;
bool autoMode          = true;
bool heating           = false;
bool lockout           = false;
bool sensorOk          = false;
bool converting        = false;
float waterF           = 0;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(HEAT_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  heatOff();
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  probe.begin();
  probe.setWaitForConversion(false);

  if (HAS_BIRD) {
    bird.attach(BIRD_PIN);
    bird.write(BIRD_HUDDLE);
    delay(400);
    bird.detach();
  }

  Serial.println("Birdbath thermostat. Short press = 20s heat test.");
  requestTemp();
}

void loop() {
  handleButton();
  readTemp();
  applyThermostat();
  showStatus();
  maybeSip();
  delay(20);
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    autoMode = !autoMode;
    longPressHandled = true;
    if (!autoMode) {
      heatOff();
      Serial.println("Auto off.");
      flash(4);
    } else {
      Serial.println("Auto on.");
      flash(2);
    }
  }

  if (!down && buttonWasDown && !longPressHandled) {
    Serial.println("Heat test 20s.");
    testUntil = millis() + TEST_MS;
  }

  buttonWasDown = down;
}

void requestTemp() {
  probe.requestTemperatures();
  converting = true;
  convertUntil = millis() + CONVERT_MS;
}

void readTemp() {
  if (!converting) {
    if (millis() - lastSampleMs >= SAMPLE_MS) requestTemp();
    return;
  }
  if (millis() < convertUntil) return;

  converting = false;
  lastSampleMs = millis();
  float c = probe.getTempCByIndex(0);
  if (c < -50 || c > 80) {
    sensorOk = false;
    waterF = 0;
    Serial.println("Sensor fail. Heat off.");
    return;
  }

  sensorOk = true;
  waterF = c * 1.8 + 32.0;
  Serial.print("Water ");
  Serial.print(waterF, 1);
  Serial.println(" F");
}

void applyThermostat() {
  bool test = millis() < testUntil;
  if (!sensorOk && !test) {
    heatOff();
    lockout = true;
    return;
  }

  if (sensorOk && waterF >= HARD_MAX_F) {
    if (!lockout) Serial.println("Too warm. Lockout.");
    lockout = true;
    heatOff();
    testUntil = 0;
    return;
  }
  lockout = false;

  if (test) {
    heatOn();
    return;
  }

  if (!autoMode) {
    heatOff();
    return;
  }

  if (!sensorOk) {
    heatOff();
    return;
  }

  if (!heating && waterF <= HEAT_ON_F) {
    Serial.println("Cold. Heat.");
    heatOn();
  } else if (heating && waterF >= HEAT_OFF_F) {
    Serial.println("Warm enough.");
    heatOff();
  }
}

void heatOn() {
  digitalWrite(HEAT_PIN, HEAT_ON_LEVEL);
  if (HAS_PUMP) digitalWrite(PUMP_PIN, HEAT_ON_LEVEL);
  heating = true;
}

void heatOff() {
  digitalWrite(HEAT_PIN, !HEAT_ON_LEVEL);
  digitalWrite(PUMP_PIN, !HEAT_ON_LEVEL);
  heating = false;
}

void showStatus() {
  unsigned long pace = BLINK_SLOW_MS;
  bool blink = heating;
  if (!sensorOk || lockout) {
    blink = true;
    pace = BLINK_FAST_MS;
  }
  if (!blink) {
    digitalWrite(LED_PIN, sensorOk ? HIGH : LOW);
    return;
  }
  unsigned long pulse = millis() % (pace * 2);
  digitalWrite(LED_PIN, pulse < pace ? HIGH : LOW);
}

void maybeSip() {
  if (!HAS_BIRD) return;
  if (millis() - lastSipMs < SIP_EVERY_MS) return;
  lastSipMs = millis();

  int pose = BIRD_HUDDLE;
  if (!sensorOk || lockout) pose = BIRD_AWAY;
  else if (!heating && sensorOk) pose = BIRD_SIP;

  bird.attach(BIRD_PIN);
  bird.write(pose);
  delay(350);
  if (pose == BIRD_SIP) {
    bird.write(BIRD_HUDDLE);
    delay(250);
  }
  bird.detach();
}

void flash(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    delay(80);
  }
}
