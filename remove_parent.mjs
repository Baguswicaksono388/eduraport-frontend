import fs from 'fs';
let content = fs.readFileSync('apps/web/app/pages/student/index.vue', 'utf8');

// Remove useParent import and usage
content = content.replace(/import \{ useParent \} from '\.\.\/\.\.\/composables\/useParent'\n/, '');
content = content.replace(/const \{ parents, fetchParents, createParent, updateParent, deleteParent \} = useParent\(\)\n/, '');

// Remove parent management refs and functions (starts with '// Parent Management Refs' up to 'const filteredClasses')
content = content.replace(/\/\/ Parent Management Refs[\s\S]*?(?=\n\/\/ Classes filtered by selected)/, '');

// Remove parent button from table
content = content.replace(/<button @click="openParentModal\(student\)"[\s\S]*?<\/button>\s*/, '');

// Remove Parent Management Modal
content = content.replace(/\s*<!-- Parent Management Modal -->[\s\S]*?(?=<\/div>\s*<\/template>)/, '\n  ');

fs.writeFileSync('apps/web/app/pages/student/index.vue', content);
console.log('Successfully removed parent logic from student index');
