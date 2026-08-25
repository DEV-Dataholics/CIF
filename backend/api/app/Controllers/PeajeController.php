<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\HTTP\ResponseInterface;

class PeajeController extends ResourceController
{
    protected $format = "json";

    public function index(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $builder = $db->table("peajes");
        return $this->json(["ok" => true, "peajes" => $builder->get()->getResultArray()]);
    }

    public function create(): ResponseInterface
    {
        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw["puente"])) $data["puente"] = $raw["puente"];
        if (isset($raw["tarifa"])) $data["tarifa"] = $raw["tarifa"];
        if (isset($raw["vigencia"])) $data["vigencia"] = $raw["vigencia"];
        if (isset($raw["activo"])) $data["activo"] = $raw["activo"] ? 1 : 0;
        else $data["activo"] = 1;
        
        $db = \Config\Database::connect();
        $db->table("peajes")->insert($data);
        return $this->json(["ok" => true, "id" => $db->insertID()]);
    }

    public function update($id = null): ResponseInterface
    {
        $raw = $this->request->getJSON(true);
        $data = [];
        if (isset($raw["puente"])) $data["puente"] = $raw["puente"];
        if (isset($raw["tarifa"])) $data["tarifa"] = $raw["tarifa"];
        if (isset($raw["vigencia"])) $data["vigencia"] = $raw["vigencia"];
        if (isset($raw["activo"])) $data["activo"] = $raw["activo"] ? 1 : 0;

        if (!empty($data)) {
            \Config\Database::connect()->table("peajes")->where("id", $id)->update($data);
        }
        return $this->json(["ok" => true]);
    }

    public function delete($id = null): ResponseInterface
    {
        \Config\Database::connect()->table("peajes")->where("id", $id)->delete();
        return $this->json(["ok" => true]);
    }

    protected function json(array $data, int $status = 200): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON($data);
    }
}
