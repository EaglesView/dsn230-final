<?php
    require_once("action/CommonAction.php");
    class LoginAction extends CommonAction {

        public function __construct() {
            parent::__construct(CommonAction::$VISIBILITY_PUBLIC);
        }
        protected function authenticate($username,$password) {
            $result = "";
            $data = [];
            $data["username"] = $username;
            $data["password"] = $password;

            $result = parent::callAPI("signin", $data);
            return $result;
            // Pour voir les informations retournées : var_dump($result);exit;
        }

        
        protected function executeAction() {
            $successMessage = "";
            $errorMessage = "Aucun utilisateur ou mot de passe entré.";

            // le code de l'action est ici
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!empty($_POST["username"]) && !empty($_POST["password"])) {
                    //User a tout entré, on sauvegarde et on envoie
                    $username = $_POST["username"];
                    $password = $_POST["password"];
                    $result = self::authenticate($username,$password);
                    if($result != "INVALID_USERNAME_PASSWORD"){
                        // $result est un objet, utiliser -> au lieu de []
                        $_SESSION["username"] = $username;
                        $_SESSION["key"] = $result->key;
                        $_SESSION["visibility"] = 3; // Tous les joueurs connectés ont visibility 3

                        return [
                            "status" => "success",
                            "message" => "Connexion réussie",
                            "key" => $result->key,
                            "visibility" => 3
                        ];
                    } else {
                        $errorMessage = "result is Null!! pourri!!";
                        return ["status" => "error", "message" => $errorMessage];
                    }
                
                } 
            }
            return compact("successMessage", "errorMessage");
        }
    }