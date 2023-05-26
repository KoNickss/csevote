FROM alpine:latest
EXPOSE 80
ADD . /app
RUN apk add nodejs npm sed

RUN cat /app/app.js \
	| sed 's/8881/80/g' > /app/app.js

RUN cd /app \
	&& npm i

RUN apk del sed

WORKDIR /app
ENTRYPOINT ["/usr/bin/node"]
CMD ["/app"]
