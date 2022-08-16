const myCountry = 'Kazakhstan';                     // Моя страна
const PAGES_PER_TIME = 5;                             // Количество страниц загружать за раз
const tasks = [1711, 1685, 1826, 1713, 1888, 1886]; // Номера тасков для показа
// Будут загружаться студенты с баллами не менее половины от максимума
const KOEF_THRESHOLD = 1/2;
const myCourse = __NEXT_DATA__.props.pageProps.course ? // Текущий курс
    __NEXT_DATA__.props.pageProps.course.id :
    __NEXT_DATA__.props.pageProps.courses.filter(el => !el.completed)[0].id;


let mass = [];

// https://app.rs.school/api/v2/course/58/students/score?activeOnly=true&orderBy=rank&orderDirection=asc&current=1&pageSize=100
// https://app.rs.school/api/v2/courses/58/tasks

async function getURL(url) {
  return fetch(url).then(data => data.json());
}

async function getUsers(page) {
    const reqURL = `https://app.rs.school/api/v2/course/${myCourse}/students/score?current=${page}&pageSize=100&orderBy=rank&orderDirection=asc&activeOnly=true`;
    return getURL(reqURL)
}

async function getTasks() {
    const reqURL = `https://app.rs.school/api/v2/courses/${myCourse}/tasks`;
    return getURL(reqURL)
}

async function main() {
    const begin = Date.now();
    let data = await getUsers(1);
    mass = mass.concat(data.content);
    const maxScore = mass[0].totalScore * KOEF_THRESHOLD;
    const maxPages = data.pagination.totalPages;
    for (let i = 2; i < maxPages; i += PAGES_PER_TIME) {
        const promiseMass = [];
        for (let j = 0; j < PAGES_PER_TIME; j++) {
            promiseMass.push(getUsers(i + j));
        }
        respMass = await Promise.all(promiseMass);
        respMass.forEach(m => { mass = mass.concat(m.content); });
        const minScore = mass[mass.length - 1].totalScore;
        if (minScore < maxScore) break;
    }
    const dataFiltered = mass.filter(el => el.countryName === myCountry && el.totalScore > 0);
    const tasksNames = await getTasks();
    console.log(tasksNames);
    const dataSelected = dataFiltered.map(el => {
        const obj = {
            'total-rank': el.rank,
            name: el.name,
            github: el.githubId,
            score: el.totalScore,
            city: el.cityName,
        };
        tasks.forEach(task => {
          const name = tasksNames.find(id => id.id === task);
          let taskData = el.taskResults.find(el2 => el2.courseTaskId === task);
          if (!taskData) taskData = '---'; else taskData = taskData.score;
          obj[name.name] = taskData;
        })
        obj.mentor = el.mentor ? el.mentor.githubId + ' - ' + el.mentor.name : '---';
        return obj;
    });
    console.table(dataSelected);
    const end = Date.now();
    console.log('Done in ', ((end - begin) / 1000).toFixed(1), ' c');
}

main();
