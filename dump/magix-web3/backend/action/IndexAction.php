<?php
    require_once("action/CommonAction.php");

    class IndexAction extends CommonAction {

        public function __construct() {
            parent::__construct(CommonAction::$VISIBILITY_PUBLIC);
        }

        protected function executeAction() {
            $successMessage = "";
            $errorMessage = "";

            // le code de l'action est ici
            return compact("successMessage", "errorMessage");
        }
    }