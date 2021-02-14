const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

const getCircularErrorReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      if (value instanceof Error) {
        return {
            // Pull all enumerable properties, supporting properties on custom Errors
            ...value,
            // Explicitly pull Error's non-enumerable properties
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
      }
      return value;
    };
  };


export function cookError(error): string {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
    // client-side error
    errorMessage = `Error: ${error.error.message}`;
    } else {
    // server-side error
    errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return errorMessage;
}

export function safeStringify(obj: any): string {
    return  JSON.stringify(obj, getCircularReplacer());
}

export function safeStringifyError(obj: any): string {
    return  JSON.stringify(obj, getCircularErrorReplacer());
}
