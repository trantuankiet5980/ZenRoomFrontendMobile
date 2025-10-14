export const resolvePropertyTitle = (property) => {
  if (!property) {
    return "Không có tiêu đề";
  }

  return (
    property.title ||
    property.name ||
    property.propertyName ||
    property.buildingName ||
    "Không có tiêu đề"
  );
};

export const resolvePropertyName = (property) => {
  if (!property) {
    return null;
  }

  return property.propertyName || property.name || property.buildingName || null;
};