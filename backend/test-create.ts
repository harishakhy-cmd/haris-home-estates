import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/v1/properties', {
      title: "Test Property",
      price: 500000,
      city: "Kampala",
      description: "Nice apartment",
      propertyType: "APARTMENT",
      bedrooms: 2,
      bathrooms: 1,
      address: "Kololo",
      imageUrls: [],
      youtubeUrls: [],
      amenityNames: [],
      nearbyFacilities: []
    });
    console.log("Success:", res.data);
  } catch (err: any) {
    console.error("Error:", err.response?.data || err.message);
  }
}

test();
