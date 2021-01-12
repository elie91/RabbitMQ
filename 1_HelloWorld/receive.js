
const amqp = require('amqplib');

amqp.connect('amqp://localhost')
    .then(function (conn) {

        process.once('SIGINT', function () { conn.close(); });

        return conn.createChannel()
            .then(function (ch) {

                var ok = ch.assertQueue('hello', { durable: false });

                ok = ok.then(function (_qok) {
                    return ch.consume('hello', function (msg) {
                        console.log(" [x] Received '%s'", msg.content.toString());
                    }, { noAck: true });
                });

                return ok.then(function (_consumeOk) {
                    console.log(' [*] Waiting for messages. To exit press CTRL+C');
                });
            });
    }).catch(console.warn);


/*
const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        const queue = 'hello';

        channel.assertQueue(queue, {
            durable: false
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
        }, {
            noAck: true
        });
    });
});
*/