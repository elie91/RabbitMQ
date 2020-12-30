# RabbitMQ tutoriel 1

## Commandes: 

* Liste des queues : `docker-compose exec rabbitmq rabbitmqctl list_queues `
* Liste des exchanges: `docker-compose exec rabbitmq rabbitmqctl list_exchanges`
* Liste des bindings: `docker-compose exec rabbitmq rabbitmqctl list_bindings`

## Exemple avec un publisher et un receiver
## Commandes
* `docker-compose up`
* `node 1_HelloWorld/receive.js`
* `node 1_HelloWorld/send.js`


## Exemple Work Queues
* `docker-compose up`
* `node 2_WorkQueues/receive_log.js`
* `node 2_WorkQueues/emit_log.js Message....`
  
### Round Robin
Si on lance plusieurs worker dans des terminals différents, on constate que les messages sont dispatchés entre les consumer 
Ce comportement de distribution des messages est appelé `round-robin`.
RabbitMQ envoie chaque n-ième message au n-ième consumer.

### Message Acknowledgment
RabbitMQ permet également un comportement appelé `message acknowledgments.`. En effet, actuellement, notre producer affiche
immédiatement un message de succès dès qu'il a transmis le message à un des consumer, sans attendre que le consumer ait réellement fini
sa tâche, si celle-ci prend plusieurs secondes par exemple.
Si un des consumer meurt et ne finis pas sa tâche, nous perdons le message qu'il était en train de produire, ainsi que les autres message envoyés à ce consumer
mais non encore exécutés.


Ainsi, un `ack(acknowledgments)` peut être envoyés par le consumer au producer, pour lui dire que le message a été reçu, traité, et que RabbitMQ peut maintenant le supprimer.
Si un consumer meurt sans avoir envoyé de `ack`, RabbitMQ comprend que le message n'a pas été entièrement traité, et va le remettre dans la queue, et l'envoyer à un autre consumer.
De cette façon, aucun message ne sera perdu

### Message durability
Même avec le ack, nos tâches et queues seront perdu si le serveur RabbitMQ stop.
On peut marquer les messages et queues comme `durable`, de façon à ce qu'ils survivent à un restart du serveur.


`channel.assertQueue('task_queue', {durable: true});` signifie que la queue est durable; doit être appliqué au producer et aux consumers


Il faut également marquer les messages comme persistants:
`channel.sendToQueue(queue, Buffer.from(msg), {persistent: true});`

### Fair dispatch

Vous avez peut-être remarqué que la répartition ne fonctionne toujours pas exactement comme nous le souhaitons. Par exemple, dans une situation avec deux workers, lorsque tous les messages impairs sont lourds et les messages pairs légers, un worker sera constamment occupé et l'autre ne fera pratiquement aucun travail. 

Eh bien, RabbitMQ n'en sait rien et enverra toujours les messages de manière uniforme.

Cela se produit car RabbitMQ distribue simplement un message lorsque le message entre dans la file d'attente. Il ne regarde pas le nombre de messages non acquittés pour un consommateur. Il envoie juste aveuglément chaque n-ième message au n-ième consommateur.

Pour éviter cela, nous pouvons utiliser `channel.prefetch(1);`. 
Cela indique à RabbitMQ de ne pas donner plus d'un message à un travailleur à la fois. Ou, en d'autres termes, n'envoyez pas un nouveau message à un travailleur tant qu'il n'a pas traité et reconnu le précédent. Au lieu de cela, il l'envoie au prochain travailleur qui n'est pas encore occupé.

## Publish Subscribe

L'idée centrale du modèle de messagerie de RabbitMQ est que le producer n'envoie jamais de messages directement à une queue. 
En fait, très souvent, le producer ne sait même pas si un message sera remis à une file d'attente.
Au lieu de cela, le producer ne peut envoyer des messages qu'à un échange.

Un échange est une chose très simple. D'un côté, il reçoit les messages des producteurs et de l'autre, il les pousse dans les files d'attente. 
L'échange doit savoir exactement quoi faire avec un message qu'il reçoit. Doit-il être ajouté à une file d'attente particulière? Doit-il être ajouté à de nombreuses files d'attente? Ou devrait-il être jeté. Les règles pour cela sont définies par le type d'échange.


Il existe différents types d'exchanges disponibles: `direct`, `topic`, `headers` and `fanout`.
* `fanout`: diffuse tous les messages qu'il reçoit à toutes les queues qu'il connaît

### Temporary queues

when we supply queue name as an empty string, we create a non-durable queue with a generated name:

`channel.assertQueue('', { exclusive: true });`

When the connection that declared it closes, the queue will be deleted because it is declared as exclusive

### Bindings

We've already created a fanout exchange and a queue. Now we need to tell the exchange to send messages to our queue. That relationship between exchange and a queue is called a binding.

`channel.bindQueue(queue_name, 'logs', '');`

