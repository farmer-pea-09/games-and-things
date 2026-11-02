/*
  Desk kraken — 3 reach tentacles + 1 steal arm

  BOARD: Arduino Nano (same as the feeder)
  Hidden under the front lip of the desk. You talk at it.
  The cheap mic cannot hear words — only that you are talking —
  then tentacles climb up and the magnet arm steals paperclips.

  MOUNT (no holes in the desk)
  ----------------------------
  1. Paint stirrer or scrap slat = the rail.
  2. Two spring clamps pinch the rail to the underside of the
     desktop, a finger-width back from the front edge.
  3. Zip-tie the 4 servos to the rail so their shafts sit just
     behind the lip, horns pointing down when "hidden".
  4. Snack box with Nano + battery zip-tied to the same rail.
  5. Wires stay under the desk. Nothing on the top except
     tentacles when they hunt.

  TENTACLES (V1 — hinged flaps, these actually work)
  -------------------------------------------------
  Each reach tentacle is a cardboard strip ~25 cm long, 2 cm wide.
  Tape a hinge of packing tape at the desk-edge end.
  Hot-glue that end to a servo horn.

    hidden  = hanging straight down under the desk
    hunt    = servo rotates ~100° so the strip slaps onto the desk

  A rubber band from mid-tentacle back to the rail helps it
  fall home if the servo loosens.

  STEAL ARM (paperclips)
  ----------------------
  Popsicle stick on the 4th servo. Fridge magnet at the tip.
  Scatter paperclips in a line near the front edge. It sweeps
  twice and drags them into a cup taped under the desk.

  Pens only work if they have a metal clip, or you clip one on.

  WIRING
  ------
  Servo reach 1  orange → D9
  Servo reach 2  orange → D10
  Servo reach 3  orange → D11
  Servo steal    orange → D6
  All servo browns → GND
  All servo reds   → 5V pack  (not Nano 5V if 4 servos twitch)
  Share GND with the Nano.

  Hunt button    D2 → button → GND   (INPUT_PULLUP)
  Onboard LED    D13 on during an attack.

  Microphone add-on (electret / KY-038 style)
    VCC → 5V
    GND → GND
    AO  → A0
    DO  unused (leave it unconnected)

  Tape the mic under the FRONT LIP, capsule facing your chair,
  not glued to a servo. It needs your voice, not wood knocks.
  Servos are loud — the code ignores the mic during an attack
  and for a few seconds after.

  If the Nano resets when they all move, power servos from a
  separate 5V pack and still tie the grounds together.

  HOW TO USE
  ----------
  1. Tweak the angle arrays below until hidden = fully under
     the desk and hunt = flat on the desktop.
  2. Say anything for about half a second ("kraken", "steal
     that", whatever). That is an attack.
  3. A single knock is ignored. A light rustle can twitch
     one tentacle.
  4. Short press = attack anyway. Hold 2 seconds = panic hide.
  5. Open Serial at 9600. If talking does nothing, lower
     VOICE_DELTA. If the fridge triggers it, raise VOICE_HITS.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int MIC_AO_PIN = A0;
const int LED_PIN    = 13;

const int PIN_REACH[3] = { 9, 10, 11 };
const int PIN_STEAL    = 6;

// Tweak these after the first mount. Units are servo degrees.
const int REACH_HIDE[3] = { 20, 20, 20 };
const int REACH_HUNT[3] = { 120, 115, 125 };

const int STEAL_REST  = 30;   // magnet hanging under the lip
const int STEAL_OUT   = 140;  // magnet out on the desktop
const int STEAL_RAKE  = 50;   // dragged back toward the cave

const int MOVE_MS        = 400;
const int POSE_MS        = 350;
const int RAKE_MS        = 600;
const int VOICE_DELTA  = 40;   // talking is quieter than a knock
const int VOICE_HITS   = 10;   // loud samples inside the window
const unsigned long VOICE_WINDOW_MS = 400;
const unsigned long LONG_PRESS_MS  = 2000;
const unsigned long HUNT_LOCK_MS   = 4000;
const unsigned long TWITCH_LOCK_MS = 1500;
const unsigned long MIC_IGNORE_MS  = 2500;

Servo reach[3];
Servo steal;

unsigned long buttonDownMs = 0;
unsigned long lastHuntMs   = 0;
unsigned long lastTwitchMs = 0;
unsigned long micIgnoreUntil = 0;
unsigned long voiceStartMs = 0;
int voiceHits = 0;
int micQuiet = 512;
int nextTwitch = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  micQuiet = listenForQuiet();
  hideAll();
  Serial.print("Desk kraken hiding. Mic quiet=");
  Serial.println(micQuiet);
}

void loop() {
  handleButton();
  handleMic();
  delay(20);
}

int listenForQuiet() {
  long sum = 0;
  for (int i = 0; i < 40; i++) {
    sum += analogRead(MIC_AO_PIN);
    delay(10);
  }
  return (int)(sum / 40);
}

void handleMic() {
  if (millis() < micIgnoreUntil) return;
  if (millis() - lastHuntMs < HUNT_LOCK_MS) return;

  int spike = analogRead(MIC_AO_PIN) - micQuiet;
  if (spike < 0) spike = -spike;

  if (spike >= VOICE_DELTA) {
    if (voiceStartMs == 0) voiceStartMs = millis();
    voiceHits++;
  }

  if (voiceStartMs != 0 && millis() - voiceStartMs >= VOICE_WINDOW_MS) {
    int hits = voiceHits;
    resetVoice();
    if (hits >= VOICE_HITS) {
      Serial.print("Heard talking (");
      Serial.print(hits);
      Serial.println(" hits). Attack.");
      attack();
    } else if (hits >= 1 && hits <= 2 &&
               millis() - lastTwitchMs >= TWITCH_LOCK_MS) {
      Serial.println("Felt a bang. Peek.");
      twitch();
    }
  }
}

void resetVoice() {
  voiceStartMs = 0;
  voiceHits = 0;
}

void twitch() {
  int i = nextTwitch;
  nextTwitch = (nextTwitch + 1) % 3;
  digitalWrite(LED_PIN, HIGH);
  moveReach(i, REACH_HUNT[i]);
  delay(POSE_MS);
  moveReach(i, REACH_HIDE[i]);
  delay(MOVE_MS);
  detachAll();
  lastTwitchMs = millis();
  micIgnoreUntil = millis() + MIC_IGNORE_MS;
  digitalWrite(LED_PIN, LOW);
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    Serial.println("Panic hide.");
    resetVoice();
    hideAll();
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (millis() - lastHuntMs >= HUNT_LOCK_MS) {
      attack();
    } else {
      Serial.println("Still digesting.");
    }
  }

  buttonWasDown = down;
}

void attack() {
  Serial.println("Steal the clips.");
  digitalWrite(LED_PIN, HIGH);

  for (int i = 0; i < 3; i++) {
    moveReach(i, REACH_HUNT[i]);
    delay(POSE_MS);
  }

  // Two rakes. Paperclips stick to the magnet and ride off the edge.
  for (int swipe = 0; swipe < 2; swipe++) {
    moveSteal(STEAL_OUT);
    delay(POSE_MS);
    moveSteal(STEAL_RAKE);
    delay(RAKE_MS);
  }

  vanish();
  lastHuntMs = millis();
  lastTwitchMs = millis();
  micIgnoreUntil = millis() + MIC_IGNORE_MS;
  digitalWrite(LED_PIN, LOW);
}

void vanish() {
  moveSteal(STEAL_REST);
  delay(POSE_MS);
  for (int i = 2; i >= 0; i--) {
    moveReach(i, REACH_HIDE[i]);
    delay(POSE_MS);
  }
  detachAll();
}

void hideAll() {
  moveSteal(STEAL_REST);
  for (int i = 0; i < 3; i++) {
    moveReach(i, REACH_HIDE[i]);
  }
  delay(MOVE_MS);
  detachAll();
}

void moveReach(int i, int angle) {
  reach[i].attach(PIN_REACH[i]);
  reach[i].write(angle);
  delay(MOVE_MS);
}

void moveSteal(int angle) {
  steal.attach(PIN_STEAL);
  steal.write(angle);
  delay(MOVE_MS);
}

void detachAll() {
  for (int i = 0; i < 3; i++) {
    reach[i].detach();
  }
  steal.detach();
}
