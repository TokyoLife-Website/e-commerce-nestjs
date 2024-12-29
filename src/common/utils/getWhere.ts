import { ILike } from 'typeorm';

export const getWhere = (filters: Record<string, string | number>) => {
  const where = Object.keys(filters).reduce((acc, key) => {
    const value = filters[key];

    if (typeof value === 'string') {
      acc[key] = ILike(`%${value}%`);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});

  return where;
};
