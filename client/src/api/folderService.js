import axios from 'axios';

const baseUrl = 'http://localhost:3000/folders';

export const fetchFolders = async () => {
  try {
    const response = await axios.get(baseUrl);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении папок: ", error);
    throw error;
  }
};
