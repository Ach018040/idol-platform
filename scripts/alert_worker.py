from evaluate_alerts import *
from time import sleep

while True:
    print("Running alert worker...")
    # reuse evaluation logic
    # trigger sendNotification later
    sleep(300)
