/*
  Switch motor — on while the switch is on

  BOARD: Arduino Nano (same as the feeder)
  No extra libraries.

  Toggle / slide switch ON  → DC motor runs
  Switch OFF                → motor stops
  Flip it back on           → it runs again

  This is NOT a clicky button that latches. Use a switch
  that STAYS in the position you leave it.

  The Nano pin cannot feed a motor. A MOSFET (or a 5 V
  relay module) switches the motor pack.

  MOUNT
  -----
  1. Snack box: Nano + motor pack inside.
  2. Switch on the LID, where your thumb is.
  3. Motor outside the box. Wires through a hole.
     Rubber band the motor to whatever it spins.

        [ switch ]
      = snack lid =
       [ Nano ]
       [ pack ]
          |
       MOSFET → motor

  WIRING
  ------
  Switch       D2 → switch → GND     (INPUT_PULLUP)
               ON  = switch CLOSED (D2 reads LOW)
               OFF = switch OPEN

  MOSFET module
               SIG / PWM → D3
               VIN / V+  → motor pack +  (5 V or 12 V)
               GND       → pack − AND Nano GND
               OUT       → motor +
               motor −   → pack −

  If you only have a transistor, not a module:
               D3 → 220 Ω → NPN base (2N2222 / 2N3904)
               emitter → GND
               collector → motor −
               motor + → pack +
               diode 1N4007 across the motor
                 (stripe toward pack +)

  Motor pack and Nano MUST share GND.
  Do NOT power the motor from the Nano 5V pin.

  LED onboard  D13 on while the motor is running.

  HOW TO USE
  ----------
  1. Upload. Switch OFF. Motor still. LED off.
  2. Switch ON. Motor spins. LED on.
  3. Switch OFF. Motor dies. That is the whole sketch.
  4. If it runs while the switch is off, the MOSFET is
     inverted — set MOTOR_ON_LEVEL to LOW.
  5. If the Nano resets when the motor kicks, the pack
     is starving. Bigger pack, still share GND.
*/

const int SWITCH_PIN = 2;
const int MOTOR_PIN  = 3;
const int LED_PIN    = 13;

const int MOTOR_ON_LEVEL = HIGH;  // flip to LOW if the MOSFET is inverted

void setup() {
  pinMode(SWITCH_PIN, INPUT_PULLUP);
  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  motorOff();

  Serial.begin(9600);
  delay(200);
  Serial.println("Switch motor. ON = spin, OFF = stop.");
}

void loop() {
  bool switchOn = digitalRead(SWITCH_PIN) == LOW;

  if (switchOn) {
    motorOn();
  } else {
    motorOff();
  }

  delay(10);
}

void motorOn() {
  digitalWrite(MOTOR_PIN, MOTOR_ON_LEVEL);
  digitalWrite(LED_PIN, HIGH);
}

void motorOff() {
  digitalWrite(MOTOR_PIN, !MOTOR_ON_LEVEL);
  digitalWrite(LED_PIN, LOW);
}
