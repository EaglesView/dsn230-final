<?php
require_once("action/GameAction.php");

$action = new GameAction();
$data = $action->execute();

header('Content-Type: application/json');
echo json_encode($data);