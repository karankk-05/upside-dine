const RoleSelector = ({ roles, selectedRole, onRoleChange }) => {
  return (
    <div className="role-selector">
      {roles.map((role) => (
        <button
          key={role.id}
          className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
          onClick={() => onRoleChange(role.id)}
        >
          <span className="role-icon">{role.icon}</span>
          <span className="role-label">{role.label}</span>
        </button>
      ))}
    </div>
  );
};

export default RoleSelector;
