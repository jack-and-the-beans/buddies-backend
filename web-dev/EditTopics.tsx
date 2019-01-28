import * as React from 'react';
import FlipMove from 'react-flip-move';
import * as _ from 'lodash';

function Topic(props: { topic: Topic }) {
    return (
        <div className="card">
            <h1>{props.topic.name}</h1>
            <img src={props.topic.image_url} />
        </div>
    );
}

function Topic__Loading() {
    return (
        <div className="card">
            <div className="load-block"></div>
            <div className="load-block--large"></div>
        </div>
    );
}

export class CreateTopic extends React.PureComponent<{ onCreate(toCreate: TopicToCreate): Promise<any> }, TopicToCreate & { isSaving: boolean, error: string }> {
    state = {
        name: "",
        imageFile: null,
        isSaving: false,
        error: "",
    };

    private handleSelectedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            imageFile: ((event.target as HTMLInputElement).files || [null])[0] || null,
        });
    };

    private handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            name: (event.target as HTMLInputElement).value,
        });
    };

    private create = () => {
        this.setState({ isSaving: true });

        this.props.onCreate(this.state)
            .then(() => {
                this.setState({
                    name: "",
                    imageFile: null,
                    isSaving: false,
                })
            })
            .catch(error => {
                if (typeof error === "string") {
                    this.setState({ error });
                }
                else {
                    console.log(error);
                }
            });
    };

    render() {
        return (
            <div className="card">
                <div className="field">
                    <div className="label">Topic Name:</div>
                    <input disabled={this.state.isSaving} type="text" value={this.state.name} onChange={this.handleNameChange} />
                </div>
                <div className="field">
                    <div className="label">Topic Photo:</div>
                    <input disabled={this.state.isSaving} type="file" onChange={this.handleSelectedFile}  />
                </div>
                <div>{this.state.error}</div>
                <button disabled={this.state.isSaving} type="button" onClick={this.create}>Add</button>
            </div>
        );
    }
}

type EditTopicsProps = {
    topics: Topic[]
    onCreateTopic(topicToCreate: TopicToCreate): Promise<any>;
}

export class EditTopics extends React.PureComponent<EditTopicsProps> {
    render() {
        return (
            <div>
                <CreateTopic onCreate={this.props.onCreateTopic} key="__Create" />
                <FlipMove>
                    {this.props.topics.map(t => <Topic topic={t} key={t.name} />)}
                </FlipMove>
            </div>
        );
    }
}

export function EditTopics__Loading() {
    return (
        <div>
            <CreateTopic onCreate={this.props.onCreateTopic} key="__Create" />
            {_.times(5, n => <Topic__Loading key={n}/>)}
        </div>
    );
}