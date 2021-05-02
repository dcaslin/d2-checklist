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
  return JSON.stringify(obj, getCircularReplacer());
}

export function safeStringifyError(obj: any): string {
  return JSON.stringify(obj, getCircularErrorReplacer());
}

export type Primer = (data: string) => any;

export const sortByField = (field: string, reverse: boolean, primer: Primer) => {
  const key = primer ?
    function (x) {
      return primer(x[field]);
    } :
    function (x) {
      return x[field];
    };

  const iReverse = !reverse ? 1 : -1;
  return function (a: any, b: any) {
    const valA = key(a);
    const valB = key(b);
    if (valA > valB) {
      return iReverse * 1;
    } else if (valB > valA) {
      return iReverse * -1;
    } else {
      return 0;
    }
  };
};

const BOTS = [
  '\\+https:\\/\\/developers.google.com\\/\\+\\/web\\/snippet\\/',
  'googlebot',
  'baiduspider',
  'gurujibot',
  'yandexbot',
  'slurp',
  'msnbot',
  'bingbot',
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot',
  'slackbot',
  'telegrambot',
  'applebot',
  'pingdom',
  'tumblr '
];

const IS_BOT_REGEXP = new RegExp('^.*(' + BOTS.join('|') + ').*$');

export function isSearchBot(): boolean {
  return true;
  try {
    if (!navigator || !navigator.userAgent) {
      return false;
    }
    const userAgent = navigator.userAgent;
    const results = IS_BOT_REGEXP.exec(userAgent.toLowerCase());
    return results != null;

  } catch (x) {
    console.log('Error checking user agent: ' + x);
    console.dir(x);
    return false;
  }
}
