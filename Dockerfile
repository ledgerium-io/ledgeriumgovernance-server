FROM mhart/alpine-node:8

RUN apk add --no-cache --virtual .build-deps \
        git \
        bash \
        curl \
        python \
        make \
        g++

RUN mkdir -p /ledgerium/governanceapp/governanceapp

ADD . /ledgerium/governanceapp/governanceapp

WORKDIR /ledgerium/governanceapp/governanceapp

RUN npm install

ENTRYPOINT ["tail", "-f", "/dev/null"]
