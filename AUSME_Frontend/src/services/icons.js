const icons = import.meta.glob("../assets/college_icons/*.svg", { eager: true });

export function getCollegeIcon(name) {
  const key = `../assets/college_icons/${name}.svg`;
  return icons[key]?.default || "";
}
