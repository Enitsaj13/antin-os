export type ApiClientOptions = {
  baseUrl: string;
};

let apiBaseUrl = 'http://localhost:3001';

export function configureApiClient(options: ApiClientOptions): void {
  apiBaseUrl = normalizeBaseUrl(options.baseUrl);
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function requestNullableJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...init,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function uploadMultipart<T>(
  path: string,
  fieldName: string,
  file: Blob,
  filename: string,
  onProgress: (progress: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append(fieldName, file, filename);

    const request = new XMLHttpRequest();
    request.open('POST', `${apiBaseUrl}${path}`);
    request.withCredentials = true;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as T);
        return;
      }

      reject(
        new Error(
          request.responseText || `Upload failed with status ${request.status}`,
        ),
      );
    };

    request.onerror = () => reject(new Error('Upload failed'));
    request.send(form);
  });
}

export function uploadBinary(
  url: string,
  file: Blob,
  contentType: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('Content-Type', contentType);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }

      reject(
        new Error(
          request.responseText || `Upload failed with status ${request.status}`,
        ),
      );
    };

    request.onerror = () => reject(new Error('Upload failed'));
    request.send(file);
  });
}
