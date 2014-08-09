// arduino/src/src.ino
//
// Author: Alex Shroyer
// Copyright (c) 2014 Trustees of Indiana University

#include "StateMachine.h"
const uint8_t LED = 13;
unsigned long timeWas = 0;
unsigned long timeIs = 0;
unsigned long interval = 2000;
unsigned long experimentStartTime = 0;
Expt experimentState = WAITING;

// TODO: this is a placeholder for an actual button press
bool button = false;

//// FUNCTIONS ////
void blink(uint8_t pin, uint16_t time_ms)
{
    digitalWrite(pin, HIGH);
    delay(time_ms);
    digitalWrite(pin, LOW);
}

void startExperiment(void)
{
    experimentStartTime = millis();
}

void runExperiment(void)
{
    // emulate users sending some button presses
    timeIs = millis();
    if (timeIs - timeWas > interval) {
        Serial.print(timeIs - experimentStartTime);
        Serial.println(", red, left");
        timeWas = timeIs;
    }
}


//// APP ////
void setup() {
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    // print the header for the CSV file
    Serial.println("");
}

void loop() {
    switch(experimentState) {

        case (WAITING):
            if ((Serial.available()) && (Serial.read() == 'b'))
                experimentState = START_NEW_EXPT;
            break;

        case START_NEW_EXPT:
            blink(LED, 500);
            startExperiment();
            experimentState = RUNNING;
            break;

        case (RUNNING):
            if (Serial.available()) {
                char inByte = Serial.read();
                if (inByte == 'b')
                    experimentState = START_NEW_EXPT;
                if (inByte == 's')
                    experimentState = WAITING;
            }
            else {
                runExperiment();
            }
            break;
    }
}
