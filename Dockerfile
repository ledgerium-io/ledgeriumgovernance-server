FROM mhart/alpine-node:8

RUN apk add --no-cache --virtual .build-deps \
        git \
        bash \
        curl \
        python \
        make \
        g++

RUN mkdir -p /ledgerium/governanceapp/governanceapp \
    && cd /ledgerium/governanceapp 
 #   && git clone -b feat/LB-101 https://github.com/ledgerium/governanceapp.git
ADD . /ledgerium/governanceapp/governanceapp

# to be removed in the future
WORKDIR /ledgerium/governanceapp/governanceapp
#RUN git checkout feat/LB-101
RUN npm install

WORKDIR /ledgerium/governanceapp/governanceapp/app

RUN npm install
RUN npm install web3@1.0.0-beta.36

ENTRYPOINT ["tail", "-f", "/dev/null"]
#CMD [ "node", "-version", "node", "governanceUI.js" ]
