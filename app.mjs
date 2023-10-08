// app.mjs
import express from 'express';
//import {resolve, dirname} from 'path';
import {readFile, readdir} from 'fs';
import {fileURLToPath} from 'url';
import * as path from 'path';
import {Task} from './task.mjs';
import {promisify} from 'util';
const app = express();
app.use(express.urlencoded({ extended: true }));
// set hbs engine
app.set('view engine', 'hbs');


// TODO: use middleware to serve static files from public
// make sure to calculate the absolute path to the directory
// with import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// TODO: use middleware required for reading body
app.use(express.static(path.join(__dirname, 'public')));
// The global list to store all tasks to be rendered
const taskList = [];

// The reading path
const readingPath = path.resolve(__dirname, './saved-tasks');
const readFileAsync = promisify(readFile);
const readdirAsync = promisify(readdir);

async function loadTasksFromFiles() {
  try {
    const filenames = await readdirAsync(readingPath);
    const tasks = await Promise.all(
      filenames.map(filename => 
        readFileAsync(path.join(readingPath, filename), 'utf-8')
        .then(content => JSON.parse(content))
      )
    );
    return tasks.map(taskData => new Task(taskData));
  } catch (err) {
    console.error('Error reading tasks:', err);
    return [];
  }
}

/**
 * This function sort tasks by the give criteria "sort-by" and "sort-order"
 * @param {Request} req query should contain "sort-by" and "sort-order"
 * @param {[Task]} l the array of tasks to be sorted
 * @return {[Task]} sorted array of tasks by the given criteria
 */
function sortTasks(req, l) {
  if (req.query['sort-by'] && req.query['sort-order']) {
    const newL = [...l];
    const crit = req.query['sort-by'];
    const ord = req.query['sort-order'];
    newL.sort((a, b)=>{
      if (ord === 'asc') {
        switch (crit) {
          case 'due-date': {
            const a1 = new Date(a[crit]);
            const b1 = new Date(b[crit]);
            if (a1 === b1) { return 0; }
            return a1 > b1 ? 1 : -1;
          }
          case 'priority': {
            return a[crit] - b[crit];
          }
          default: {
            return 0;
          }
        }
      } else if (ord === 'desc') {
        switch (crit) {
          case 'due-date': {
            const a1 = new Date(a[crit]);
            const b1 = new Date(b[crit]);
            if (a1 === b1) { return 0; }
            return a1 < b1 ? 1 : -1;
          }
          case 'priority': {
            return b[crit] - a[crit];
          }
          default: {
            return 0;
          }
        }
      } else {
        return [];
      }
    });
    return newL;
  } else {
    return l;
  }
}

/**
 * This function sort tasks by whether they are pinned or not
 * @param {[Task]} l the array of tasks to be sorted
 * @return {[Task]} sorted array of tasks, with pinned tasks first
 */
function pinnedTasks(l) {
  return [...l].sort((a, b)=>b.pinned-a.pinned);
}
app.get('/', async(req, res) => {
  try {
    // 1. Load the tasks from files
    const tasksFromFiles = await loadTasksFromFiles();
    
    // 2. Combine them with tasks from the memory
    const combinedTasks = [...tasksFromFiles, ...taskList];
    console.log("Combined Tasks:", combinedTasks);
    console.log("All Task Titles:", combinedTasks.map(task => task.title));
    
    // 3. Use this combined list for subsequent operations
    let filteredTasks = combinedTasks;
    if(req.query.titleQ) {
      const searchTitle = req.query.titleQ.toLowerCase();
      filteredTasks = filteredTasks.filter(task => task.title.toLowerCase().includes(searchTitle));
      console.log("Filtered Task Titles:", filteredTasks.map(task => task.title));
    }
    if(req.query.tagQ) {
      const searchTag = req.query.tagQ.toLowerCase();
      filteredTasks = filteredTasks.filter(task => task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTag)));
    }
 
    // Sorting
    const pinnedSortedTasks = pinnedTasks(filteredTasks);
    const sortedTasks = sortTasks(req, pinnedSortedTasks); 
    res.render('home', { tasks: sortedTasks });
} catch (err) {
    console.error('Error loading tasks:', err);
    res.status(500).send('Server Error');
}
});

app.get('/add', (req, res) => {
  res.render('newtask');
});
app.post('/add', (req, res) => {
  // Access the form data using req.body
  const taskData = req.body;
  
  // Convert the "pinned" value from the radio buttons to a boolean
  taskData.pinned = taskData.pinned === 'true';

  // Convert priority to an integer
  taskData.priority = parseInt(taskData.priority, 10);

  // Split the tags string into an array of tags
  if (taskData.tags) {
    taskData.tags = taskData.tags.split(',').map(tag => tag.trim());
  } else {
    taskData.tags = [];
  }

  const newTask = new Task(taskData);
  taskList.push(newTask);

  res.redirect('/');
});



app.listen(3000);
