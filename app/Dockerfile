FROM mhart/alpine-node:8

RUN apk add --no-cache --virtual .build-deps \
        git \
        bash \
        python \
        make \
        g++

RUN mkdir -p /ledgerium/governanceapp \
    && cd /ledgerium/governanceapp \
    && git clone https://github.com/ledgerium/governanceApp.git

# to be removed in the future
WORKDIR /ledgerium/governanceapp/governanceApp/
RUN git checkout feat/LB-101
RUN npm install

WORKDIR /ledgerium/governanceapp/governanceApp/app

RUN npm install
RUN npm install web3@1.0.0-beta.36

ENTRYPOINT ["tail", "-f", "/dev/null"]
#CMD [ "node", "-version", "node", "governanceUI.js" ]
