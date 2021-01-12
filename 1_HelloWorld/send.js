

const amqp = require('amqplib');

amqp.connect('amqp://localhost')
    .then(conn => conn.createChannel())
    .then((channel) => {
        var q = 'hello';
        var msg = 'Hello World!';


        return channel.assertQueue(q, { durable: false })
            .then(function (_qok) {
                // NB: `sentToQueue` and `publish` both return a boolean
                // indicating whether it's OK to send again straight away, or
                // (when `false`) that you should wait for the event `'drain'`
                // to fire before writing again. We're just doing the one write,
                // so we'll ignore it.
                channel.sendToQueue(q, Buffer.from(msg));
                console.log(" [x] Sent '%s'", msg);
                return channel.close();
            });
    })
    .finally(function () { conn.close(); })
    .catch(console.warn);

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
        const msg = 'Hello World!';

        channel.assertQueue(queue, {
            durable: false
        });
        channel.sendToQueue(queue, Buffer.from(msg));
        console.log(" [x] Sent %s", msg);
    });
    setTimeout(function() {
        connection.close();
        process.exit(0);
    }, 500);
});

*/