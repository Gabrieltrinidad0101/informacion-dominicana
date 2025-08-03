import { EnvironmentConfig } from '@/infrastructure/config/config.module';
import axios from 'axios';

export class ValidateIdNumberApi {

  async validateIdNumber(idNumber) {
    try {
      if (this.config.VALIDATE_ID_NUMBER_API_PASS === 1) return true;
      const url = `${this.config.VALIDATE_ID_NUMBER_API}/${idNumber.replace(/\D+/g, '')}/validate`;
      const response = await axios.get(url);
      return response.data?.['valid'] ? "Valid" : "Invalid";
    } catch (error) {
      return "None";
    }
  }
}
