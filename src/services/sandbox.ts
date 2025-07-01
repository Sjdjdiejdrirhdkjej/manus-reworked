import { WebContainer } from '@webcontainer/api';

export class SandboxService {
  private container: WebContainer | null = null;
  private files: Record<string, { code: string }> = {};

  async initialize(sandboxKey: string, onProgress?: (step: number) => void) {
    if (!sandboxKey) throw new Error('Sandbox API key is required');

    try {
      // Initialize WebContainer
      onProgress?.(0);
      this.container = await WebContainer.boot();
      onProgress?.(1);

      // Mount initial filesystem
      onProgress?.(2);
      await this.container.mount({
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: "sandbox",
              type: "module",
              dependencies: {}
            })
          }
        }
      });
      
      // Set up workspace
      onProgress?.(3);
      await this.container.spawn('npm', ['init', '-y']);
      
      onProgress?.(4);
      return true;
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
      throw error;
    }
  }

  async createFile(path: string, content: string): Promise<string> {
    if (!this.container) throw new Error('Sandbox not initialized');

    try {
      // Add file to container
      await this.container.fs.writeFile(path, content);
      
      // Store in local tracking
      this.files[path] = { code: content };

      return content;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.container) throw new Error('Sandbox not initialized');

    try {
      const file = await this.container.fs.readFile(path, 'utf-8');
      return file;
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  }

  private async streamToString(stream: ReadableStream<string>): Promise<string> {
    const reader = stream.getReader();
    let result = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += value;
      }
    } finally {
      reader.releaseLock();
    }
    
    return result;
  }

  async executeCommand(command: string): Promise<string> {
    if (!this.container) throw new Error('Sandbox not initialized');

    try {
      // Start a shell process
      const shellProcess = await this.container.spawn('sh', ['-c', command]);
      
      // Collect the output
      const output = await this.streamToString(shellProcess.output);
      
      // Wait for the process to finish
      const exitCode = await shellProcess.exit;
      
      // If the command failed
      if (exitCode !== 0) {
        throw new Error(`Command failed with exit code ${exitCode}`);
      }

      return output;
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  async runInBackground(command: string): Promise<void> {
    if (!this.container) throw new Error('Sandbox not initialized');

    try {
      await this.container.spawn('sh', ['-c', `${command} &`]);
    } catch (error) {
      console.error('Failed to run background command:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const sandboxService = new SandboxService();