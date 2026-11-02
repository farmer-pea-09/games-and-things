/*
  Bookmark crawler — inchworm that climbs a page edge and sits

  BOARD: Arduino Nano (same as the feeder)
  Two servos, two feet. It straddles the EDGE of an open page
  like a clothespin bug, inches toward the top, then STOPS and
  sits there as a bookmark.

  Short press = climb a few steps, then sit.
  Hold 2 seconds = crawl back down toward the table.

  2 SERVOS
  --------
  Rear   D9   back segment. Bends the "butt" foot.
  Front  D5   front segment. Bends the "head" foot.

  Inchworm gait (the whole trick):
    1. Rear bends  → rear foot GRIPS, body shortens
    2. Front bends → front foot slides forward
    3. Front straightens → front foot GRIPS
    4. Rear straightens → rear foot slides up
    Repeat. Then both straighten a little and sit.

  FEET
  ----
  Each foot is a folded cardboard "U" that sandwiches the
  page. Line the inside with a pencil eraser / rubber band
  so it GRIPS when the servo leans that foot, and SLIDES
  when that foot is light. Bare cardboard will slip or rip.

  Use a JUNK paperback. Not a library book. Not grandma's
  bible. Climb the OUTER margin, not over the text if you
  can help it.

  MOUNT
  -----
  1. Two SG90s, horns facing each other, joined by a 4–6 cm
     cardboard spine (the worm body).
  2. Rear horn → rear U-foot. Front horn → front U-foot.
  3. Nano + battery sit on the TABLE, not on the book.
     Long jumper wires to the worm. The worm must stay light.
  4. Open the book. Clip both U-feet onto the right-hand
     page's outer edge, rear toward the table, head toward
     the top of the page.

        top of page
            ^  sit here
            |
         [front foot]
            servo D5
         [ spine ]
            servo D9
         [rear foot]
            |
        table / Nano

  WIRING
  ------
  Front        orange → D5
  Rear         orange → D9
  Both browns → GND
  Both reds   → 5V pack  (NOT Nano 5V)
  Share GND. Long wires from the pack on the table.

  Button       D2 → button → GND
  Onboard LED  D13 on while it climbs.

  HOW TO USE
  ----------
  1. No book. Short press. The two feet should take turns
     gripping / sliding. Serial: "Climb." then "Sitting."
  2. Clip onto a junk page. If it moonswalks down, swap
     REAR_GRIP / REAR_SLIDE (and the front pair).
  3. If it rips paper, less grip angle, more rubber, fewer
     STEPS.
  4. STEPS is how far it climbs before it sits.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int FRONT_PIN  = 5;
const int REAR_PIN   = 9;
const int LED_PIN    = 13;

// Straight-ish = 90. Tweak until one foot pinches and the
// other is loose enough to slide.
const int REAR_GRIP  = 120;
const int REAR_SLIDE = 70;
const int FRONT_GRIP = 60;
const int FRONT_SLIDE = 110;

const int STEP_MS = 280;
const int STEPS   = 6;       // how many inches before it sits
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long CRAWL_LOCK_MS = 3000;

Servo front;
Servo rear;

unsigned long buttonDownMs = 0;
unsigned long lastCrawlMs  = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  sit();
  Serial.println("Bookmark worm ready. Short press = climb and sit.");
}

void loop() {
  handleButton();
  delay(15);
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    Serial.println("Down the page.");
    climb(false);
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (millis() - lastCrawlMs >= CRAWL_LOCK_MS) {
      Serial.println("Climb.");
      climb(true);
      Serial.println("Sitting.");
    } else {
      Serial.println("Already perched.");
    }
  }

  buttonWasDown = down;
}

void climb(bool upPage) {
  digitalWrite(LED_PIN, HIGH);
  front.attach(FRONT_PIN);
  rear.attach(REAR_PIN);

  for (int i = 0; i < STEPS; i++) {
    if (upPage) {
      stepUp();
    } else {
      stepDown();
    }
  }

  sit();
  lastCrawlMs = millis();
}

void stepUp() {
  rear.write(REAR_GRIP);
  front.write(FRONT_SLIDE);
  delay(STEP_MS);

  front.write(FRONT_GRIP);
  delay(STEP_MS);

  rear.write(REAR_SLIDE);
  delay(STEP_MS);

  rear.write(REAR_GRIP);
  delay(STEP_MS);
}

void stepDown() {
  front.write(FRONT_GRIP);
  rear.write(REAR_SLIDE);
  delay(STEP_MS);

  rear.write(REAR_GRIP);
  delay(STEP_MS);

  front.write(FRONT_SLIDE);
  delay(STEP_MS);

  front.write(FRONT_GRIP);
  delay(STEP_MS);
}

void sit() {
  front.attach(FRONT_PIN);
  rear.attach(REAR_PIN);
  front.write(FRONT_GRIP);
  rear.write(REAR_GRIP);
  delay(400);
  front.detach();
  rear.detach();
  digitalWrite(LED_PIN, LOW);
}
