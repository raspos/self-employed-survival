import fs from 'node:fs';import {articles,indicators,sources,pending,methods,checkedAt} from '../dist/content.js';import {profiles,areas,defaults} from '../dist/simulation.js';
import {brands,brandMethod} from '../dist/brands.js';
const save=(path,value)=>{fs.mkdirSync(path.substring(0,path.lastIndexOf('/')),{recursive:true});fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n');};
save('data/articles/articles.json',articles);save('data/processed/indicators.json',{checkedAt,indicators,pending});save('data/raw/source-register.json',{checkedAt,note:'원문 전문이 아닌 검증용 출처 대장입니다. 기사 사진·전문은 저장하지 않습니다.',sources});save('data/assumptions/scenario.json',{kind:'fictional',profiles,areas,defaults,methods});
console.log('Exported article, statistic, source and assumption metadata');
save('data/processed/brands.json',{checkedAt,brands,method:brandMethod});
