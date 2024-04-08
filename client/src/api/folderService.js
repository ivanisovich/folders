import axios from 'axios';

const baseUrl = 'https://91.223.123.165:3000/folders';

export const fetchFolders = async () => {
  try {
    const response = await axios.get(baseUrl);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении папок: ", error);
    throw error;
  }
};
