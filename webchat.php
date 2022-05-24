<?php

use Ds\Map;
use Ds\Set;
use Ratchet\ConnectionInterface;
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\MessageComponentInterface;
use Ratchet\WebSocket\WsServer;

require 'vendor/autoload.php';

$chatComponent = new class implements MessageComponentInterface {
    private $connections;

    public function __construct()
    {
        $this->connections = new Map();
    }

    public function onOpen(ConnectionInterface $conn) {}
    public function onError(ConnectionInterface $conn, \Exception $e) {}

    public function onMessage(ConnectionInterface $from, $msg) 
    {
        $obj = json_decode($msg);
        if (!$obj->reason) return;
        echo $obj->reason;
        switch ($obj->reason){
            case 'register': $this->register($from,$obj); break;
            case 'contacts': $this->sendContacts($from); break;
            case 'dm': $this->sendDM($obj); break;
        }
    }

    public function onClose(ConnectionInterface $conn) 
    {
        $key = $this->connections->keys()->get(
            $this->connections->values()->find($conn)
        );
        $this->connections->remove($key);

        echo "$key Encerrou a conexão" . PHP_EOL;
    }

    private function register($conn,$msg)
    {
        echo ' ' . $msg->name . PHP_EOL;
        $this->connections->put($msg->name, $conn);
        foreach ($this->connections as $regs){
            $regs->send(json_encode([
                'reason'=>'contacts',
                'contatos'=>$this->connections->keys(),
            ]));
        }
        echo (json_encode($this->connections));
    }

    private function sendContacts($conn)
    {
        echo PHP_EOL;
        $obj = [
            'reason'=>'contacts',
            'contatos'=>$this->connections->keys(),
        ];
        $conn->send(json_encode($obj));
    }

    private function sendDM($msg)
    {
        echo ' ' . $msg->text . PHP_EOL;
        $obj = [
            'reason'=>'dm',
            'from' => $msg->from,
            'text'=>$msg->text,
        ];
        $this->connections
            ->get($msg->to)
            ->send(json_encode($obj));
    }
};

$server = IoServer::factory(
    new HttpServer(
        new WsServer($chatComponent)
    ), 
    7777
);

$server->run();