use unitel_recruitment;

select
    users.id,
    roles.name,
    role_permissions.id,
    permissions.name,
    permissions.action
from
    users
    inner join roles on users.role_id = roles.id
    inner join role_permissions on roles.id = role_permissions.role_id
    inner join permissions on role_permissions.permission_id = permissions.id;

select
    *
from
    positions;