<?php
    require_once("action/CommonAction.php");

    class SessionAction extends CommonAction {
      public function __construct() {
          parent::__construct(CommonAction::$VISIBILITY_PUBLIC); // Pas de redirect pour les guest
      }

      protected function executeAction() {
          // Retourne les infos de session si dispos
          return [
              "key" => $_SESSION["key"] ?? null,
              "visibility" => $_SESSION["visibility"] ?? 0
          ];
          // CommonAction->execute() ajoute isLoggedIn et username tout seuls
    }
}