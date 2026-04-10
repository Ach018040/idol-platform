import type{Metadata}from 'next';
import{notFound}from 'next/navigation';
import{getInsightBySlug,insightPosts}from '../../../lib/insights';
export async function generateStaticParams(){return insightPosts.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:{slug:string}}):Promise<Metadata>{const post=getInsightBySlug(params.slug);if(!post)return{title:'文章不存在'};return{title:post.title,description:post.summary};}
export default function InsightDetailPage({params}:{params:{slug:string}}){const post=getInsightBySlug(params.slug);if(!post)notFound();return(<article className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm text-cyan-300">{post.category}</p><h1 className="mt-3 text-4xl font-bold leading-tight text-white">{post.title}</h1><p className="mt-4 text-sm text-zinc-500">{post.date}</p><div className="mt-10 space-y-6 text-base leading-8 text-zinc-300">{post.content.map((p,i)=>(<p key={i}>{p}</p>))}</div></article>)} 
