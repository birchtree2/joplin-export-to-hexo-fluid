
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
function frontMatterCreator(notetitle: string,newtitle: string, tags, categories, excerpt :string, extrafrontmatter :string){
    let frontMatter='---\n';
	let title=newtitle;
	if(newtitle === "") title=notetitle;
    frontMatter+=`title: ${title}\n`;
	//date
    let today = new Date();//https://www.srcmini.com/3475.html
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' '
                + today.getHours() + ':' +today.getMinutes() + ':' + today.getSeconds();
    frontMatter+=`date: ${date}\n`;
	//tags
	frontMatter+="tags:\n";
	let taglist=tags.split(' ');
	for(let i=0;i<taglist.length;i++){
		frontMatter+=`- ${taglist[i]}\n`;
	}
	//categories
	frontMatter+=`categories:\n- [${categories}]\n`;
	//excerpt
	if(excerpt === "") excerpt=title;
    frontMatter+=`excerpt: ${excerpt}\n`;

	frontMatter+=extrafrontmatter;
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
		note.body = note.body.replace( `:/${resource.id}`,  `/img/${resource.title}` );//extension has been added
    
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
            	        <label class="block-element labels" for="dest_Path"> Project Path (<span>*required</span>) </label>
					    <input class="block-element" id="dest_Path" type="text" name="dest_Path" required autocomplete placeholder="D:\\blog" />   
            	    </div>
					</div class="field">
					<label class="block-element labels" for="title"> Title(If left blank, will default to the note title.) </label>
					<input class="block-element" id="title" type="text" name="title" required autocomplete placeholder="" />   
					</div>
					</div class="field">
					<label class="block-element labels" for="tags"> Tags(separated by spaces)  </label>
					<input class="block-element" id="tags" type="text" name="tags" required autocomplete placeholder="" />   
					</div>
					</div class="field">
					<label class="block-element labels" for="categories"> Categories(separated by comma",")  </label>
					<input class="block-element" id="categories" type="text" name="categories" required autocomplete placeholder="" />   
					</div>
					</div class="field">
					<label class="block-element labels" for="excerpt"> Excerpt (<span>If left blank, will default to the article title.</span>) </label>
					<input class="block-element" id="excerpt" type="text" name="excerpt" required autocomplete placeholder="" />   
					</div>
            	    <div class="field">
					    <label class="block-element labels" for="frontMatter" >Extra Front Matter (<span>optional</span>) </label>
					    <textarea placeholder="Type front matter here..." class="block-element" id = "frontMatter" rows = 4 cols="20" name="frontMatter"></textarea>
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
				// let ssg = args[1].basic_info.ssg;
				
				let title=args[1].basic_info.title;
				let tags=args[1].basic_info.tags;
				let categories=args[1].basic_info.categories;
				let excerpt=args[1].basic_info.excerpt;
				let dest_Path = args[1].basic_info.dest_Path;
				let frontMatter = args[1].basic_info.frontMatter;
				const basketFolder = await joplin.data.get(['folders', args[0]], { fields: ['id', 'title', 'body'] });
				const { items } = await joplin.data.get(['notes'], { fields: ['id', 'title', 'body', 'parent_id'] });
				// filteredNotes have unknown problem!!!
				const filteredNotes = items.filter( note => {
					return (note.parent_id === args[0]);
				});
				//
          		const folderName = basketFolder.title + '-' + basketFolder.id ;
				await fs.mkdirp(path.join(dest_Path, 'source', '_posts'));//markdown
				await fs.mkdirp(path.join(dest_Path, 'source' , 'img'));//static
				const resourceDestPath = (path.join(dest_Path, 'source' , 'img'));
				for (var i = 0; i < filteredNotes.length; i++) {
					const note = filteredNotes[i];
					await resourceFetcher(note, resourceDir, resourceDestPath,"hexo");
					note.body = frontMatterCreator(note.title,title,tags,categories,excerpt,frontMatter); 
								+ '\n' + note.body;//add hexo required frontMatter
					fs.writeFile(path.join(dest_Path, 'source', '_posts', `${note.title}.md`), note.body);
				};
        
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
		
	//export single note
	await joplin.commands.register({
		name: 'exportingNoteProcedure',
		execute: async (...args) => {
			
			//---------prequesite variables
			// let ssg = args[1].basic_info.ssg;
			let title=args[1].basic_info.title;
			let tags=args[1].basic_info.tags;
			let categories=args[1].basic_info.categories;
			let excerpt=args[1].basic_info.excerpt;
			let dest_Path = args[1].basic_info.dest_Path;
			let frontMatter = args[1].basic_info.frontMatter;
			const note = await joplin.data.get(['notes', args[0]], { fields: ['id', 'title', 'body'] });
			await fs.mkdirp(path.join(dest_Path, 'source', '_posts'));//markdown
			await fs.mkdirp(path.join(dest_Path, 'source' , 'img'));//static
			const resourceDestPath = (path.join(dest_Path, 'source' , 'img'));
			await resourceFetcher(note, resourceDir, resourceDestPath, "hexo");
			note.body = frontMatterCreator(note.title,title,tags,categories,excerpt,frontMatter); 
								+ '\n' + note.body;//add hexo required frontMatter//add hexo required frontMatter
			fs.writeFile(path.join(dest_Path, 'source', '_posts', `${note.title}.md`), note.body);

	}});
	await joplin.commands.register({
			name: 'staticSiteExporterDialog_Note',
			label: 'Export Note to SSG',
			execute: async (noteId: string[]) => {
				const { id, formData } = await dialogs.open(ssg_dialog);
				if (id == "submit") {
					//---------form validation
					
					if (!path.isAbsolute(formData.basic_info.dest_Path)) {
						alert('Provided path is not valid.')
						return;
					}
					await joplin.commands.execute('exportingNoteProcedure', noteId[0] , formData);
				}
			},
		});
		await joplin.views.menuItems.create('Export Note to SSG','staticSiteExporterDialog_Note',MenuItemLocation.NoteListContextMenu);
		}
	});