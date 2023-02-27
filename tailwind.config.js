module.exports = {
    content: [
      './**/*.html',
      './index.html',
      './*.html'
    ],
    darkMode: true,
    theme: {
      extend: {
        colors: {
          'mycol0': '#200f4c',
          //'mycol': '#8870ff',
          'mycol': '#8a97ff',
          'mycol2': '#161524',
        },
        backgroundImage: {
          'bground1': "url('/webPage/img/bground1.jpg')",
        },
        animation: {
          wiggle: 'wiggle 1s ease-in-out infinite',
        },
      },
    },
    plugins: [],
}
  