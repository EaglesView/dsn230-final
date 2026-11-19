<?php
require_once "action/CommonAction.php";

class GameAction extends CommonAction
{
    public function __construct()
    {
        parent::__construct(CommonAction::$VISIBILITY_MEMBER); // Requires login
    }

    protected function executeAction()
    {
        // Joindre une partie (page 11 API)
        if (!empty($_POST["action"]) && $_POST["action"] === "join") {
            return $this->joinGame();
        }
        // Recevoir l'état du jeu (page 12 API)
        if (!empty($_POST["action"]) && $_POST["action"] === "state") {
            return $this->getGameState();
        }
        if (!empty($_POST["action"]) && $_POST["action"] === "surrender") {
            return $this->surrender();
        }
        if (!empty($_POST["action"]) && $_POST["action"] === "end_turn") {
            return $this->endTurn();
        }
        // Actions du jeu (page 14 API)
        if (!empty($_POST["action"]) && $_POST["action"] === "play") {
            return $this->playCard();
        }
        if (!empty($_POST["action"]) && $_POST["action"] === "attack") {
            return $this->attack();
        }
        return ["status" => "error", "message" => "Invalid action"];
    }

    private function joinGame()
    {
        $type = $_POST["type"] ?? "TRAINING"; // PVP, TRAINING
        $mode = $_POST["mode"] ?? "STANDARD"; // STANDARD, COOP, ARENA
        $privateKey = $_POST["privateKey"] ?? null;

        $data = [
            "key" => $_SESSION["key"],
            "type" => $type,
        ];

        if (!empty($mode)) {
            $data["mode"] = $mode;
        }

        if (!empty($privateKey)) {
            $data["privateKey"] = $privateKey;
        }

        $result = parent::callAPI("games/auto-match", $data);

        // Garde la partie en session
        if ($result === "JOINED_PVP" || $result === "JOINED_TRAINING") {
            $_SESSION["inGame"] = true;
            $_SESSION["gameType"] = $type;
            return ["status" => "success", "message" => $result];
        }

        return ["status" => "error", "message" => $result];
    }
    private function surrender()
    {
        $data = [
            "key" => $_SESSION["key"],
            "type" => "SURRENDER",
        ];
        $result = parent::callAPI("games/action", $data);

        return ["status" => "success", "data" => $result];
    }
    private function endTurn()
    {
        $data = [
            "key" => $_SESSION["key"],
            "type" => "END_TURN",
        ];
        $result = parent::callAPI("games/action", $data);

        return ["status" => "success", "data" => $result];
    }
    private function getGameState()
    {
        $data = ["key" => $_SESSION["key"]];
        $result = parent::callAPI("games/state", $data);

        return ["status" => "success", "data" => $result];
    }
    private function playCard()
    {
        $uid = $_POST["uid"] ?? 0;
        $data = [
            "key" => $_SESSION["key"],
            "type" => "PLAY",
            "uid" => $uid,
        ];
        $result = parent::callAPI("games/action", $data);
        return ["status" => "success", "data" => $result];
    }
    private function attack()
    {
        $uid = $_POST["uid"] ?? 0;
        $targetUid = $_POST["targetUid"] ?? 0;
        $data = [
            "key" => $_SESSION["key"],
            "type" => "ATTACK",
            "uid" => $uid,
            "targetuid" => $targetUid,
        ];
        $result = parent::callAPI("games/action", $data);
        return ["status" => "success", "data" => $result];
    }
    private function heroPower()
    {
        $data = [
            "key" => $_SESSION["key"],
            "type" => "HERO_POWER",
        ];
        $result = parent::callAPI("games/action", $data);

        return ["status" => "success", "data" => $result];
    }
}
