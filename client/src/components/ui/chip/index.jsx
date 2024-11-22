const StatusChip = ({ status }) => {
  let chipColor = "";
  let textColor = "";

  switch (status) {
    case "completed":
      chipColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "pending":
      chipColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    case "failed":
      chipColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    default:
      chipColor = "bg-gray-100";
      textColor = "text-gray-800";
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${chipColor} ${textColor}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusChip;
