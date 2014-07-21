// arduino/src/src.ino
//
// Author: Alex Shroyer
// Copyright (c) 2014 Trustees of Indiana University
//
// emulates the Event Marker (but without blue teeth)
#include "StateMachine.h"
const uint8_t LED = 13;
unsigned long timeWas = 0;
unsigned long timeIs = 0;
unsigned long interval = 2000;
unsigned long experimentStartTime = 0;
Expt experimentState = WAITING;

void blink(uint8_t pin, uint16_t time) {
  digitalWrite(pin, HIGH);
  delay(time);
  digitalWrite(pin, LOW);
}

bool buzzer() {
  if (Serial.available()) { // simulate buzzer to start experiment
    char inByte = Serial.read();
    if (inByte == 'b') {
      experimentStartTime = millis(); // reset the start time
      // do a longer blink
      blink(LED, 500);
      return true;
    }
  }
  return false;
}

void runExperiment() {
  // emulate users sending some button presses
  timeIs = millis(); // update loop timer
  if (timeIs - timeWas > interval) {
    Serial.print(timeIs - experimentStartTime);
    Serial.println(", red, left");
    timeWas = timeIs; // reset the start timer
    //blink(LED, 50);
  }
}

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  // print the header for the CSV file
  Serial.println("");
  Serial.println("time, color, button");
}

void loop() {
  switch(experimentState) {

    case (WAITING):
      if (buzzer()) {
        experimentState = RUNNING;
      }
      break;

    case (RUNNING):
      if (buzzer()) {
        experimentState = WAITING;
      }
      else {
        runExperiment();
      }
      break;
  }
}
