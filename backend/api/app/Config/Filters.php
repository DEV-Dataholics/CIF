<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;
use App\Filters\AuthFilter;
use App\Filters\AuditFilter;

class Filters extends BaseConfig
{
    /**
     * Aliases para los filtros.
     */
    public array $aliases = [
        'csrf'          => \CodeIgniter\Filters\CSRF::class,
        'toolbar'       => \CodeIgniter\Filters\DebugToolbar::class,
        'honeypot'      => \CodeIgniter\Filters\Honeypot::class,
        'invalidchars'  => \CodeIgniter\Filters\InvalidChars::class,
        'secureheaders' => \CodeIgniter\Filters\SecureHeaders::class,
        'auth'          => AuthFilter::class,
        'audit'         => AuditFilter::class,  // ← CIF: Agregado
    ];

    public array $globals = [
        'before' => [],
        'after'  => ['toolbar', 'audit'],
    ];

    public array $methods = [];
    public array $filters = [];
}
