<?php
namespace App\Controllers;
use CodeIgniter\RESTful\ResourceController;
class PreciosController extends ResourceController
{
    protected $modelName = 'App\Models\PrecioModel';
    protected $format    = 'json';

    public function index()
    {
        return $this->respond($this->model->findAll());
    }

    public function create()
    {
        $data = $this->request->getJSON(true);
        $this->model->insert($data);
        return $this->respondCreated(['id' => $this->model->getInsertID()]);
    }

    public function update($id = null)
    {
        $data = $this->request->getJSON(true);
        $this->model->update($id, $data);
        return $this->respond(['status' => 'updated']);
    }

    public function delete($id = null)
    {
        $this->model->delete($id);
        return $this->respondDeleted(['id' => $id]);
    }
}
