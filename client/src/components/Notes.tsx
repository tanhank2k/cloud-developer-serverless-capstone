import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import Auth from '../auth/Auth'
import { Note } from '../types/notes/Note'
import { createNote, deleteNote, getNotes, patchNote } from '../api/notes-api'

interface NotesProps {
  auth: Auth
  history: History
}

interface NotesState {
  notes: Note[]
  newNoteName: string
  newNoteDesciption: string
  loadingTodos: boolean
}

export class Notes extends React.PureComponent<NotesProps, NotesState> {
  state: NotesState = {
    notes: [{
      noteId: 'string',
      createdAt: '12/11/2000',
      name: 'string_name',
      description: 'string'
    }],
    newNoteName: '',
    newNoteDesciption: '',
    loadingTodos: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newNoteName: event.target.value })
  }

  handleDescriptionNoteItemChange = (event: React.ChangeEvent<HTMLInputElement>, pos: number) => {
    const note = this.state.notes[pos]
    this.setState({
      notes: update(this.state.notes, {
        [pos]: { name: { $set: note.name }, description: { $set: event.target.value} }
      })
    })
  }

  onEditButtonClick = (noteId: string) => {
    this.props.history.push(`/notes/${noteId}/edit`)
  }

  onNoteCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const newNote = await createNote(this.props.auth.getIdToken(), {
        name: this.state.newNoteName,
        description: this.state.newNoteDesciption
      })
      this.setState({
        notes: [...this.state.notes, newNote],
        newNoteName: ''
      })
    } catch {
      alert('Note creation failed')
    }
  }

  onNoteDelete = async (noteId: string) => {
    try {
      await deleteNote(this.props.auth.getIdToken(), noteId)
      this.setState({
        notes: this.state.notes.filter(note => note.noteId !== noteId)
      })
    } catch {
      alert('Note deletion failed')
    }
  }

  onNoteUpdate = async (pos: number) => {
    try {
      const note = this.state.notes[pos]
      console.log(note);
      
      await patchNote(this.props.auth.getIdToken(), note.noteId, {
        name: note.name,
        description: note.description,
      })
      this.setState({
        notes: update(this.state.notes, {
          [pos]: { name: { $set: note.name }, description: { $set: note.description} }
        })
      })
      alert(`Update note  failed ${note.name} successful`)
    } catch {
      alert('Note deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const notes = await getNotes(this.props.auth.getIdToken())
      this.setState({
        notes: notes,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch notes: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Notes</Header>

        {this.renderCreateNoteInput()}

        {this.renderNotes()}
      </div>
    )
  }

  renderCreateNoteInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New note',
              onClick: this.onNoteCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderNotes() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderNotesList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Notes
        </Loader>
      </Grid.Row>
    )
  }

  renderNotesList() {
    return (
      <Grid padded>
        {this.state.notes?.map((note, pos) => {
          return (
            <Grid.Row key={note.noteId}>
              <Grid.Column width={10} verticalAlign="middle">
                <Grid.Row>
                <Input
                    label='Name'
                    labelPosition='right'
                    value={note.name}
                    disabled
                  />
                </Grid.Row>
                <Grid.Row>
                  <Input
                    type='text'
                    label='Description'
                    labelPosition='right'
                    action={{
                      content: 'Update',
                      onClick: () => this.onNoteUpdate(pos)
                    }}
                    onChange={(e:any) => this.handleDescriptionNoteItemChange(e, pos)}
                    defaultValue={note.description}
                  />
                </Grid.Row>
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                Create at: {note.createdAt}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(note.noteId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onNoteDelete(note.noteId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {note.attachmentUrl && (
                <Image src={note.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
