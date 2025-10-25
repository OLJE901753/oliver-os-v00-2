
      // Test file with various code patterns
      import { Config } from './config';
      import { Logger } from './logger';

      export class TestService {
        private _config: Config;
        private _logger: Logger;

        constructor(config: Config) {
          this._config = config;
          this._logger = new Logger('TestService');
        }

        async fetchData(url: string): Promise<any> {
          try {
            const response = await fetch(url);
            return await response.json();
          } catch (error) {
            this._logger.error('Failed to fetch data:', error);
            throw error;
          }
        }

        processData(data: any[]): any[] {
          return data.filter(item => item.valid);
        }
      }
    