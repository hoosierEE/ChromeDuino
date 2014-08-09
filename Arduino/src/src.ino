// arduino/src/src.ino
//
// Author: Alex Shroyer
// Copyright (c) 2014 Trustees of Indiana University


const uint8_t LED = 13;
const uint8_t WAITING = 0;
const uint8_t START_NEW_EXPT = 1;
const uint8_t RUNNING = 2;

bool sentOneLetterR = false;
uint8_t experimentState = WAITING;
uint32_t timeWas = 0;
uint32_t bigTimeWas = 0;
uint32_t timeIs = 0;
uint32_t interval = 2000;
uint32_t bigInterval = 12000;
uint32_t experimentStartTime = 0;

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
    if (timeIs - bigTimeWas > bigInterval) {
        Serial.println("r");
        bigTimeWas = timeIs;
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
                //if (inByte == 'r')
                //    sentOneLetterR = true;
                if (inByte == 'b')
                    experimentState = START_NEW_EXPT;
                if (inByte == 's')
                    experimentState = WAITING;
            }
            // else {
                runExperiment();
            // }
            break;
    }
}
