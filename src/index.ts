// import joplin from 'api';
// import { ToolbarButtonLocation } from 'api/types';
// // const uslug = require('@joplin/fork-uslug');
// // joplin.plugins.register({
// // 	onStart: async function() {
// // 		console.info('Hello world. Test plugin started!');
// // 	},
// // });
// // const joplin = require('joplin-api');
// const fs = (joplin as any).require('fs-extra');
// const path = require('path');

// // 导出笔记到指定目录下的文件
// async function exportNotebook(notebookId, exportPath) {
//   try {
//     // 获取笔记本的所有笔记
//     const notes = await joplin.data.get(['notes'], { notebook_id: notebookId });
//     console.log(`导出笔记本：${notebookId}，共${notes.items.length}个笔记`);

//     // 创建图片文件夹
//     const imagesPath = path.join(exportPath, 'images');
//     if (!fs.existsSync(imagesPath)) {
//       fs.mkdirSync(imagesPath);
//     }

//     // 将笔记导出为Markdown格式的文件
//     for (let i = 0; i < notes.items.length; i++) {
//       const note = notes.items[i];
//       const content = note.body || '';

//       // 获取笔记中的图片附件
//       const resources = await joplin.data.get(['resources'], { note_id: note.id });
//       for (let j = 0; j < resources.items.length; j++) {
//         const resource = resources.items[j];
//         if (resource.mime === 'image/jpeg' || resource.mime === 'image/png') {
//           // 将图片附件保存为文件
//           const imagePath = path.join(imagesPath, `${resource.id}.${resource.file_extension}`);
//           fs.writeFileSync(imagePath, await joplin.data.get(['resources', resource.id]));
//         }
//       }

//       // 将笔记内容保存为Markdown文件
//       fs.writeFileSync(`${exportPath}/${note.title}.md`, content);
//     }

//     console.log(`导出笔记本：${notebookId}，成功导出${notes.items.length}个笔记`);
//   } catch (error) {
//     console.error('导出笔记本失败', error);
//   }
// }
// async function exportNoteImages(noteId) {
//   const note = await joplin.data.get(['notes', noteId], { fields: ['id', 'title', 'body'] });

//   // 用正则表达式匹配出所有的图片标签
//   const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/g;
//   let match;
//   while ((match = imgRegex.exec(note.body)) !== null) {
//     const imgUrl = match[1];
//     const imgData = await joplin.data.get(['resources', imgUrl], { fields: ['id', 'title', 'file_name', 'mime', 'data'] });
//     const imgName = imgData.title || imgData.file_name || imgData.id;
//     const imgExt = imgData.mime ? imgData.mime.split('/')[1] : 'jpg';

//     const folderPath = `./${note.title}_images`;
//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath);
//     }

//     const filePath = `${folderPath}/${imgName}.${imgExt}`;
//     fs.writeFileSync(filePath, imgData.data);
//   }
// }

// joplin.commands.register({
//   name: 'exportNoteImages',
//   label: 'Export Note Images',
//   iconName: 'fas fa-image',
//   execute: async () => {
//     const noteId = await joplin.workspace.selectedNoteIds();
//     if (!noteId.length) {
//       await joplin.views.dialogs.showMessageBox('Please select a note to export its images.');
//       return;
//     }
//     await exportNoteImages(noteId[0]);
//   },
// });



// // 注册导出笔记本的命令
// joplin.plugins.register({
//   onStart: async function() {
//     await joplin.commands.register({
//       name: 'exportNotebook',
//       label: '导出笔记本',
//       execute: async function(notebookId, exportPath) {
//         await exportNotebook(notebookId, exportPath);
//       }
//     });
//     await joplin.views.toolbarButtons.create('exportNoteImages', 'exportNoteImages', ToolbarButtonLocation.NoteToolbar);
//   }
// });
import joplin from 'api';
import { MenuItemLocation } from 'api/types';

const fs = (joplin as any).require('fs-extra');
const path = require('path');

//---------creates title for note as required in jekyll
function titleCreator( title : string ) {
	let today = new Date();
	let fPart = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '-';
	let sPart = title.split(' ').join('-');
	return (fPart + sPart);
}
//-------creates frontMatter for note as required in Hexo
function frontMatterCreator(title: string){
    let frontMatter='---\n';
    frontMatter+=`title: ${title}\n`;
    let today = new Date();//https://www.srcmini.com/3475.html
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' '
                + today.getHours() + ':' +today.getMinutes() + ':' + today.getSeconds();
    frontMatter+=`date: ${date}\n`;
    frontMatter+=`excerpt: ${title}\n`
    frontMatter+='---'
    return frontMatter;
}
//---------collecting and transfering the static file
async function resourceFetcher(note, resourceDir: string, destPath: string , ssg ) {
	const { items } = await joplin.data.get(['notes', note.id, 'resources'] , { fields: ['id', 'title', 'file_extension']} );
	for( var i = 0; i < items.length; i++ ) {
		const resource = items[i];
		const ext = resource.file_extension;
		const srcPath = path.join(resourceDir, `${resource.id}.${ext}`);
		const dest_Path = path.join(destPath, resource.title)
		await fs.copy(srcPath, dest_Path);
		if (ssg === 'hugo') {
			note.body = note.body.replace( `:/${resource.id}`,  `/resources/${resource.title}` );
		} else if (ssg === 'gatsby') {
			note.body = note.body.replace( `:/${resource.id}`,  path.join('..', '..', 'static' , `${resource.title}`));
		} else if (ssg === 'jekyll') {
			note.body = note.body.replace( `:/${resource.id}`, path.join('..', 'resources', `${resource.title}`));
		} else if(ssg === 'hexo'){
      note.body = note.body.replace( `:/${resource.id}`,  `/img/${resource.title}` );//extension has been added
    }
	};
};

joplin.plugins.register({
	onStart: async function () {
		const resourceDir = await joplin.settings.globalValue('resourceDir');

		/*******************Dialog Configurations*******************/
		const dialogs = joplin.views.dialogs;
		const ssg_dialog = await dialogs.create('SSG-Dialog');

		//---------setting dailog UI
		await dialogs.setHtml(ssg_dialog, `
		<div class="dialog" >
			<div class="dialog-header">
				<h2>Exporting Configuration</h2>
			</div>
			<div class="dialog-main">
				<form id="swg-form" name="basic_info">
            	    <div class="field">
						<p class="labels" >Choose your SSG (<span>*required</span>)</p>
            <label for="hexo">Hexo</label>
  						<input type="radio" id="hexo" name="ssg" value="hexo"><br>
						<label for="hugo">Hugo</label>
  						<input type="radio" id="hugo" name="ssg" value="hugo"><br>
  						<label for="gatsby">Gatsby</label>
  						<input type="radio" id="gatsby" name="ssg" value="gatsby"><br>
  						<label for="jekyll">Jekyll</label>
  						<input type="radio" id="jekyll" name="ssg" value="jekyll"><br>
            	    </div>
            	    <div class="field">
            	        <label class="block-element labels" for="dest_Path"> Project Path (<span>*required</span>) </label>
					    <input class="block-element" id="dest_Path" type="text" name="dest_Path" required autocomplete placeholder="Paste the absolute path" />   
            	    </div>
            	    <div class="field">
					    <label class="block-element labels" for="frontMatter" >Front Matter (<span>optional</span>) </label>
					    <textarea placeholder="Type front matter here..." class="block-element" id = "frontMatter" rows = 10 cols="20" name="frontMatter"></textarea>
            	    </div>
				</form> 
			</div>
		</div>
		`);

		//---------add the css file for form
		await dialogs.addScript(ssg_dialog, './form.css');

		//---------setting controls of dialog
		await dialogs.setButtons(ssg_dialog, [
			{
				id: 'submit',
				title : 'Export',
			},
			{
				id: 'cancel',
				title:'Cancel'
			}
		]);

		/*******************Exporting Code*******************/
		await joplin.commands.register({
            name: 'exportingProcedure',
			execute: async (...args) => {
				
				//---------prequesite variables
				let ssg = args[1].basic_info.ssg;
				let dest_Path = args[1].basic_info.dest_Path;
				let frontMatter = args[1].basic_info.frontMatter;
				const basketFolder = await joplin.data.get(['folders', args[0]], { fields: ['id', 'title', 'body'] });
				const { items } = await joplin.data.get(['notes'], { fields: ['id', 'title', 'body', 'parent_id'] });
				const filteredNotes = items.filter( note => {
					return (note.parent_id === args[0]);
				});
        if(ssg === 'hexo'){
          const folderName = basketFolder.title + '-' + basketFolder.id ;
					await fs.mkdirp(path.join(dest_Path, 'source', '_posts'));//markdown

					await fs.mkdirp(path.join(dest_Path, 'source' , 'img'));//static

					const resourceDestPath = (path.join(dest_Path, 'source' , 'img'));

					for (var i = 0; i < filteredNotes.length; i++) {
						const note = filteredNotes[i];
						await resourceFetcher(note, resourceDir, resourceDestPath, ssg);
						note.body = frontMatter+ frontMatterCreator(note.title) + '\n' + note.body;//add hexo required frontMatter
						fs.writeFile(path.join(dest_Path, 'source', '_posts', `${note.title}.md`), note.body);
					};
        }else if (ssg === 'hugo') {
					//---------handle exporting into hugo
					const folderName = basketFolder.title + '-' + basketFolder.id ;
					await fs.mkdirp(path.join(dest_Path, 'content', folderName));//markdown

					await fs.mkdirp(path.join(dest_Path, 'static' , 'resources'));//static'

					const resourceDestPath = (path.join(dest_Path, 'static' ,'resources'));

					for (var i = 0; i < filteredNotes.length; i++) {
						const note = filteredNotes[i];
						await resourceFetcher(note, resourceDir, resourceDestPath, ssg);
						note.body = frontMatter + '\n' + note.body;
						fs.writeFile(path.join(dest_Path, 'content', folderName, `${note.title}.md`), note.body);
					};
				} else if (ssg === 'gatsby') {
					//---------handle exporting into gatsby
					await fs.mkdirp(path.join(dest_Path, 'src', 'markdown'));//markdown

					fs.readdir(path.join(dest_Path, 'static'), async err => {
						if (err) {
							await fs.mkdirp( path.join( dest_Path , 'static' ) );//static
						}
						
						const resourceDestPath = (path.join(dest_Path, 'static'));

						for (var i = 0; i < filteredNotes.length; i++) {
							const note = filteredNotes[i];
							await resourceFetcher(note, resourceDir, resourceDestPath, ssg);
							note.body = frontMatter + '\n' + note.body;
							fs.writeFile(path.join(dest_Path, 'src', 'markdown', `${note.title}-${note.id}.md`), note.body);
						};
					});
				} else if (ssg === 'jekyll') {
					//---------handle exporting into gatsby
					fs.readdir(path.join(dest_Path, '_posts'), async (err, files) => {
						if (err) {
							await fs.mkdirp( path.join( dest_Path , '_posts' ) );//markdowns
						}
						await fs.mkdirp(path.join(dest_Path, 'resources'));//static files

						const resourceDestPath = (path.join(dest_Path , 'resources'));
						
						for(var i = 0; i < filteredNotes.length; i++) {
							const note = filteredNotes[i];
							await resourceFetcher( note , resourceDir , resourceDestPath , ssg  );
							note.body = frontMatter + '\n' + note.body;
							note.title = titleCreator(note.title);
							fs.writeFile(path.join(dest_Path , '_posts' , `${note.title}-${note.id}.md`), note.body);
						};
					});
                }
            }
		});
		
		/*******************Driver Code*******************/

		//---------respective command for main button
		await joplin.commands.register({
            name: 'staticSiteExporterDialog',
            label: 'Export to SSG',
            execute: async (folderId: string) => {
				const { id, formData } = await dialogs.open(ssg_dialog);
				if (id == "submit") {
					//---------form validation
					if (!formData.basic_info.ssg) {
						alert('Please choose one static site generator.');
						return;
					}
					if (!path.isAbsolute(formData.basic_info.dest_Path)) {
						alert('Provided path is not valid.')
						return;
					}
                    await joplin.commands.execute('exportingProcedure', folderId , formData);
                }
            },
		});
		
		//---------created main button[entry point to plugin]
		await joplin.views.menuItems.create('Export to SSG', 'staticSiteExporterDialog', MenuItemLocation.FolderContextMenu);
    // await joplin.views.menuItems.create('Export to SSG', 'staticSiteExporterDialog', MenuItemLocation.NoteListContextMenu);
    
	},
});