const createQuest = ({
  title,
  aura,
  category,
  description,
  latitude,
  longitude,
  price,
}) => {
  return {
    title: title || "Unknown Quest",
    aura: aura !== undefined ? aura : 400,
    category: category || "Adventure",
    description: description || "Explore this mysterious location!",
    latitude: latitude || 0,
    longitude: longitude || 0,
    price: price !== null ? price : null,
  };
};

module.exports = { createQuest };
