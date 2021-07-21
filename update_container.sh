#!/bin/bash
# docker exec -it homebridge_homebridge_1 sh
npm run-script build
tar -zcf dist.tar.gz dist
scp -P 22222 dist.tar.gz root@homeassistant.local:/tmp/dist.tar.gz
# ssh root@homeassistant.local -p 22222 -c "docker exec -it homebridge_homebridge_1 sh"

# ssh root@homeassistant.local -p 22222 -C \
#   "echo '#"'!'"/bin/sh' > /tmp/extract.sh && \
#   echo 'cd /homebridge/node_modules/homebridge-switchbot-openapi/ && rm -rf dist && tar -xf dist.tar.gz && chown -R root:root dist' >> /tmp/extract.sh && \
#   docker cp /tmp/extract.sh homebridge_homebridge_1:/homebridge/extract.sh &&\
#   docker exec homebridge_homebridge_1 sh -c 'chmod +x /homebridge/extract.sh'"

ssh root@homeassistant.local -p 22222 -C \
  "docker cp /tmp/dist.tar.gz homebridge_homebridge_1:/homebridge/node_modules/homebridge-switchbot-openapi/dist.tar.gz && \
  docker exec homebridge_homebridge_1 /homebridge/extract.sh"


#  && \
# docker cp /tmp/extract.sh homebridge_homebridge_1:/homebridge/extract.sh && \
# docker exec -i homebridge_homebridge_1 'chmod +x /homebridge/extract.sh' && \
