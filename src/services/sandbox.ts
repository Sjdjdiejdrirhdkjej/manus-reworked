import { WebContainer } from '@webcontainer/api';

export class SandboxService {
  private static containerPromise: Promise<WebContainer> | null = null;
  private container: WebContainer | null = null;
  private files: Record<string, { code: string }> = {};

  // Start WebContainer boot as early as possible
  static prefetch() {
    if (!this.containerPromise) {
      this.containerPromise = WebContainer.boot();
    }
    return this.containerPromise;
  }

  // Initialize this right away
  static {
    this.prefetch();
  }

  async initialize(sandboxKey: string, onProgress?: (step: number) => void) {
    if (!sandboxKey) throw new Error('Sandbox API key is required');

    try {
      // Use prefetched container
      onProgress?.(0);
      this.container = await SandboxService.containerPromise!;
      onProgress?.(1);

      // Prepare filesystem in parallel with container boot
      const initialFiles = {
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: "sandbox",
              type: "module",
              dependencies: {}
            })
          }
        }
      };

      onProgress?.(2);
      // Mount filesystem (should be very quick now)
      await this.container.mount(initialFiles);
      
      onProgress?.(3);
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