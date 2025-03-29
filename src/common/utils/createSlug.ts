import slugify from 'slugify';

export const createSlug = (name: string): string => {
  return slugify(name, {
    lower: true,
    remove: /[^a-zA-Z0-9\s-]/g,
    replacement: '-', // Chuyển khoảng trắng thành dấu "-"
    trim: true, // Loại bỏ khoảng trắng thừa đầu/cuối
    locale: 'vi',
  });
};
