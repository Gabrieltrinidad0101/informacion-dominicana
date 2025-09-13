import axios from 'axios';

export const validateIdNumberApi = async (idNumber) => {
  try {
    const url = `${process.env.VALIDATE_ID_NUMBER_API}/${idNumber.replace(/\D+/g, '')}/validate`;
    const response = await axios.get(url);
    return response.data?.['valid'] ? "Valid" : "Invalid";
  } catch (error) {
    console.log(error)
    return "None";
  }
}
