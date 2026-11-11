#!/bin/bash
cd "$(dirname "$0")/.."
A=art_src/orig
python3 tools/slice_sprites.py $A/3ec1073a4a6922cf10c910b6529c3f2861ea2f50cb2f74621a27f05b03040b42.jpg $A/7f95bfdb92ffc3c8fb7b01dc6d4a598f131a1a9d5c7f7777db7a14c9f48f1c60.jpg $A/cab38714fb6d21b210aec897b37f0e8c97c65e3d345b555b089a3485e1aa5271.jpg $A/089f623019697455963f2c699a0fbdd98743e244418650cc6954d9a6bd3980b6.jpg art_src/patients_back.jpg art_src/patients_extra.jpg
